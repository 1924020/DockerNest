from flask import request, jsonify
from flask_jwt_extended import (
    create_access_token, jwt_required, get_jwt_identity
)
from models import db, User, Container
import docker

client = docker.from_env()

def register_routes(app):
    @app.route('/api/register', methods=['POST'])
    def register():
        data = request.json
        if User.query.filter_by(username=data['username']).first():
            return jsonify({'message': 'Usuario ya existe'}), 409
        user = User(username=data['username'])
        user.set_password(data['password'])
        db.session.add(user)
        db.session.commit()
        return jsonify({'message': 'Usuario creado correctamente'})

    @app.route('/api/login', methods=['POST'])
    def login():
        data = request.json
        user = User.query.filter_by(username=data['username']).first()
        if user and user.check_password(data['password']):
            access_token = create_access_token(identity=str(user.id))
            return jsonify(access_token=access_token)
        return jsonify({'message': 'Credenciales inválidas'}), 401

    @app.route('/api/containers', methods=['GET'])
    @jwt_required()
    def get_containers():
        user_id = int(get_jwt_identity())
        containers = Container.query.filter_by(user_id=user_id).all()

        container_list = []
        for c in containers:
            try:
                docker_container = client.containers.get(c.docker_id)
                status = docker_container.status

                raw_ports = docker_container.attrs['NetworkSettings']['Ports']
                ports = {}
                if raw_ports:
                    for container_port, bindings in raw_ports.items():
                        if bindings:
                            ports[container_port] = bindings[0].get("HostPort", "?")
                        else:
                            ports[container_port] = None

                network_settings = docker_container.attrs['NetworkSettings']['Networks']
                network = list(network_settings.keys())[0] if network_settings else "desconocida"

            except docker.errors.NotFound:
                status = "not found"
                ports = {}
                network = "desconocida"

            container_list.append({
                'id': c.id,
                'name': c.name,
                'image': c.image,
                'docker_id': c.docker_id,
                'status': status,
                'ports': ports,
                'network': network
            })

        return jsonify(container_list)

    @app.route('/api/networks', methods=['POST'])
    @jwt_required()
    def create_network():
        data = request.json
        name = data.get("name")
        if not name:
            return jsonify({"message": "Falta el nombre de la red"}), 400
        try:
            client.networks.create(name)
            return jsonify({"message": f"Red '{name}' creada correctamente"})
        except docker.errors.APIError as e:
            return jsonify({"message": f"Error al crear red: {str(e)}"}), 500

    @app.route('/api/networks', methods=['GET'])
    @jwt_required()
    def list_networks():
        networks = client.networks.list()
        result = [{"name": n.name, "id": n.id} for n in networks]
        return jsonify(result)

    @app.route('/api/containers', methods=['POST'])
    @jwt_required()
    def create_container():
        user_id = int(get_jwt_identity())
        data = request.json
        name = data.get("name")
        image = data.get("image")
        command = data.get("command") or None
        env = data.get("env") or {}
        raw_ports = data.get("ports") or {}
        ports = {str(k): v for k, v in raw_ports.items()}
        network = data.get("network", "dockernest-net")

        if not name or not image:
            return jsonify({"message": "Faltan campos"}), 400

        try:
            docker_container = client.containers.run(
                image=image,
                name=f"{name}-{user_id}",
                command=command,
                network=network,
                environment=env,
                ports=ports,
                detach=True,
                labels={"user_id": str(user_id)}
            )

            container = Container(
                name=name,
                image=image,
                docker_id=docker_container.id,
                user_id=user_id
            )
            db.session.add(container)
            db.session.commit()

            return jsonify({
                "id": container.id,
                "name": container.name,
                "image": container.image,
                "docker_id": container.docker_id,
                "docker_name": docker_container.name
            })

        except docker.errors.APIError as e:
            return jsonify({"message": f"Error de Docker: {str(e)}"}), 500

    @app.route('/api/containers/<int:container_id>', methods=['DELETE'])
    @jwt_required()
    def delete_container(container_id):
        user_id = int(get_jwt_identity())
        container = Container.query.filter_by(id=container_id, user_id=user_id).first()

        if not container:
            return jsonify({'message': 'Contenedor no encontrado'}), 404

        try:
            docker_container = client.containers.get(container.docker_id)
            docker_container.stop()
            docker_container.remove()
        except docker.errors.NotFound:
            pass

        db.session.delete(container)
        db.session.commit()
        return jsonify({'message': 'Contenedor eliminado'})

    @app.route('/api/containers/<int:container_id>/restart', methods=['POST'])
    @jwt_required()
    def restart_container(container_id):
        user_id = int(get_jwt_identity())
        container = Container.query.filter_by(id=container_id, user_id=user_id).first()
        if not container:
            return jsonify({'message': 'Contenedor no encontrado'}), 404
        try:
            docker_container = client.containers.get(container.docker_id)
            docker_container.restart()
            return jsonify({'message': 'Contenedor reiniciado'})
        except docker.errors.NotFound:
            return jsonify({'message': 'Contenedor no existe en Docker'}), 404

    @app.route('/api/containers/<int:container_id>/logs', methods=['GET'])
    @jwt_required()
    def get_logs(container_id):
        user_id = int(get_jwt_identity())
        container = Container.query.filter_by(id=container_id, user_id=user_id).first()
        if not container:
            return jsonify({'message': 'Contenedor no encontrado'}), 404
        try:
            docker_container = client.containers.get(container.docker_id)
            logs = docker_container.logs(tail=50).decode('utf-8')
            return jsonify({'logs': logs})
        except docker.errors.NotFound:
            return jsonify({'message': 'Contenedor no existe en Docker'}), 404

    @app.route('/api/containers/<int:container_id>/start', methods=['POST'])
    @jwt_required()
    def start_container(container_id):
        user_id = int(get_jwt_identity())
        container = Container.query.filter_by(id=container_id, user_id=user_id).first()
        if not container:
            return jsonify({'message': 'Contenedor no encontrado'}), 404
        try:
            docker_container = client.containers.get(container.docker_id)
            docker_container.start()
            return jsonify({'message': 'Contenedor iniciado'})
        except docker.errors.APIError as e:
            return jsonify({'message': f'Error al iniciar: {str(e)}'}), 500

    @app.route('/api/containers/<int:container_id>/stop', methods=['POST'])
    @jwt_required()
    def stop_container(container_id):
        user_id = int(get_jwt_identity())
        container = Container.query.filter_by(id=container_id, user_id=user_id).first()
        if not container:
            return jsonify({'message': 'Contenedor no encontrado'}), 404
        try:
            docker_container = client.containers.get(container.docker_id)
            docker_container.stop()
            return jsonify({'message': 'Contenedor detenido'})
        except docker.errors.APIError as e:
            return jsonify({'message': f'Error al detener: {str(e)}'}), 500

    @app.route('/api/containers/<int:container_id>/stats', methods=['GET'])
    @jwt_required()
    def container_stats(container_id):
        user_id = int(get_jwt_identity())
        container = Container.query.filter_by(id=container_id, user_id=user_id).first()
        if not container:
            return jsonify({'message': 'Contenedor no encontrado'}), 404
        try:
            docker_container = client.containers.get(container.docker_id)
            stats = docker_container.stats(stream=False)

            cpu_total = stats['cpu_stats']['cpu_usage']['total_usage']
            cpu_system = stats['cpu_stats']['system_cpu_usage']
            cpu_percent = 0.0
            if cpu_system > 0.0:
                cpu_percent = (cpu_total / cpu_system) * 100.0

            mem_usage = stats['memory_stats']['usage']
            mem_limit = stats['memory_stats'].get('limit', 1)
            mem_percent = (mem_usage / mem_limit) * 100.0

            return jsonify({
                'cpu_percent': round(cpu_percent, 2),
                'mem_usage': round(mem_usage / (1024 ** 2), 2),
                'mem_limit': round(mem_limit / (1024 ** 2), 2),
                'mem_percent': round(mem_percent, 2)
            })

        except docker.errors.NotFound:
            return jsonify({'message': 'Contenedor no existe en Docker'}), 404
        except Exception as e:
            return jsonify({'message': f'Error al obtener estadísticas: {str(e)}'}), 500
